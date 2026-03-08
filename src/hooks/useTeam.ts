import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Member } from '../types'

export function useTeam() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function load() {
        try {
            setLoading(true)
            setError(null)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Determine if current user is admin
            const { data: selfProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            const currentUserIsAdmin = selfProfile?.role === 'Admin'

            // Admins see all profiles in the workspace; non-admins only see themselves.
            let query = supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (!currentUserIsAdmin) {
                query = query.eq('id', user.id)
            }

            const { data, error } = await query
            if (error) throw new Error(error.message)

            const profiles = data ?? []
            const profileIds = profiles.map(p => p.id)
            const adminIds   = profiles.filter(p => p.role === 'Admin').map(p => p.id)

            if (profileIds.length === 0) {
                setMembers([])
                return
            }

            // ── Single batch of parallel queries (replaces N+1 pattern) ──
            const now        = new Date()
            const monday     = getThisMonday(now)
            const weekStart  = monday.toISOString().slice(0, 10)
            const weekEnd    = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
            const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

            const adminProjectsPromise = adminIds.length > 0
                ? supabase
                    .from('projects')
                    .select('created_by')
                    .in('created_by', adminIds)
                    .is('deleted_at', null)
                    .neq('status', 'archived')
                : Promise.resolve({ data: [] as { created_by: string }[], error: null })

            const [weekRes, monthRes, projectRes, adminProjRes] = await Promise.all([
                supabase
                    .from('time_entries')
                    .select('user_id, duration_minutes')
                    .in('user_id', profileIds)
                    .gte('date', weekStart)
                    .lte('date', weekEnd),
                supabase
                    .from('time_entries')
                    .select('user_id, duration_minutes')
                    .in('user_id', profileIds)
                    .gte('date', monthStart),
                supabase
                    .from('project_members')
                    .select('user_id, project_id')
                    .in('user_id', profileIds),
                adminProjectsPromise,
            ])

            // Build per-user aggregation maps in JS — O(rows), no extra queries
            const weekMinsMap        = new Map<string, number>()
            const monthMinsMap       = new Map<string, number>()
            const memberProjectCount = new Map<string, number>()
            const adminProjectCount  = new Map<string, number>()

            for (const e of weekRes.data  ?? []) weekMinsMap.set(e.user_id,  (weekMinsMap.get(e.user_id)   ?? 0) + e.duration_minutes)
            for (const e of monthRes.data ?? []) monthMinsMap.set(e.user_id, (monthMinsMap.get(e.user_id)  ?? 0) + e.duration_minutes)
            for (const m of projectRes.data ?? []) memberProjectCount.set(m.user_id, (memberProjectCount.get(m.user_id) ?? 0) + 1)
            for (const p of adminProjRes.data ?? []) adminProjectCount.set(p.created_by, (adminProjectCount.get(p.created_by) ?? 0) + 1)

            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

            const members = profiles.map(profile => {
                const weekMins  = weekMinsMap.get(profile.id)  ?? 0
                const monthMins = monthMinsMap.get(profile.id) ?? 0
                const isAdminProfile = profile.role === 'Admin'
                const projectCount = isAdminProfile
                    ? (adminProjectCount.get(profile.id) ?? 0)
                    : (memberProjectCount.get(profile.id) ?? 0)

                const lastSeen = profile.last_seen ? new Date(profile.last_seen) : null
                const isOnline = lastSeen ? lastSeen > fiveMinAgo : false

                return {
                    id:             profile.id,
                    name:           profile.full_name,
                    initials:       profile.initials,
                    color:          profile.color,
                    role:           profile.role,
                    email:          profile.email ?? '',
                    isActive:       profile.is_active ?? true,
                    status:         isOnline ? 'active' : 'offline',
                    weekHours:      Math.round((weekMins  / 60) * 10) / 10,
                    monthHours:     Math.round((monthMins / 60) * 10) / 10,
                    projects:       projectCount,
                    lastSeen:       formatLastSeen(lastSeen),
                    organizationId: profile.organization_id ?? undefined,
                } as Member
            })

            setMembers(members)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load team')
        } finally {
            setLoading(false)
        }
    }

    async function updateMember(id: string, updates: { role?: string; is_active?: boolean; full_name?: string; initials?: string; color?: string }) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
        if (error) throw new Error(error.message)
        await load()
    }

    async function deleteMember(id: string) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')
        const { error } = await supabase.functions.invoke('delete-member', {
            body: { userId: id },
            headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (error) throw new Error(error.message)
        await load()
    }

    useEffect(() => {
        load()
        const interval = setInterval(load, 180 * 1000) // refresh every 180 seconds
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { members, loading, error, updateMember, deleteMember, refresh: load }
}

function getThisMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function formatLastSeen(date: Date | null): string {
    if (!date) return 'Never'
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hrs  = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hrs  < 24) return `${hrs}h ago`
    return `${days}d ago`
}