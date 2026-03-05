import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Member } from '../types'

export function useTeam() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Update current user's last_seen on mount
    useEffect(() => {
        async function updateLastSeen() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', user.id)
        }
        updateLastSeen()
    }, [])

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

            // Admins see all profiles in the workspace.
            // Non-admins only see themselves.
            let query = supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (!currentUserIsAdmin) {
                query = query.eq('id', user.id)
            }

            const { data, error } = await query

            if (error) throw new Error(error.message)

            const members = await Promise.all((data ?? []).map(async profile => {
                const now = new Date()
                const monday = getThisMonday(now)
                const weekStart = monday.toISOString().slice(0, 10)
                const weekEnd = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

                const [weekRes, monthRes, projectRes] = await Promise.all([
                    supabase
                        .from('time_entries')
                        .select('duration_minutes')
                        .eq('user_id', profile.id)
                        .gte('date', weekStart)
                        .lte('date', weekEnd),
                    supabase
                        .from('time_entries')
                        .select('duration_minutes')
                        .eq('user_id', profile.id)
                        .gte('date', monthStart),
                    // count memberships – we'll override for admins below
                    supabase
                        .from('project_members')
                        .select('project_id')
                        .eq('user_id', profile.id),
                ])

                const weekMins = (weekRes.data ?? []).reduce((s, e) => s + e.duration_minutes, 0)
                const monthMins = (monthRes.data ?? []).reduce((s, e) => s + e.duration_minutes, 0)
                let projectCount = (projectRes.data ?? []).length

                // Admins see a count of projects they own, not all projects
                if (profile.role === 'Admin') {
                    const { count: adminCount, error: countErr } = await supabase
                        .from('projects')
                        .select('id', { count: 'exact', head: true })
                        .eq('created_by', profile.id)
                        .is('deleted_at', null)
                        .neq('status', 'archived')
                    if (!countErr) {
                        projectCount = adminCount ?? 0
                    }
                }

                // Online = last_seen within 5 minutes
                const lastSeen = profile.last_seen ? new Date(profile.last_seen) : null
                const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
                const isOnline = lastSeen ? lastSeen > fiveMinAgo : false

                // Format last seen
                function formatLastSeen(date: Date | null): string {
                    if (!date) return 'Never'
                    const diff = Date.now() - date.getTime()
                    const mins = Math.floor(diff / 60000)
                    const hrs = Math.floor(mins / 60)
                    const days = Math.floor(hrs / 24)
                    if (mins < 1) return 'Just now'
                    if (mins < 60) return `${mins}m ago`
                    if (hrs < 24) return `${hrs}h ago`
                    return `${days}d ago`
                }

                return {
                    id: profile.id,
                    name: profile.full_name,
                    initials: profile.initials,
                    color: profile.color,
                    role: profile.role,
                    email: profile.email ?? '',
                    isActive: profile.is_active ?? true,
                    status: isOnline ? 'active' : 'offline',
                    weekHours: Math.round((weekMins / 60) * 10) / 10,
                    monthHours: Math.round((monthMins / 60) * 10) / 10,
                    projects: projectCount,
                    lastSeen: formatLastSeen(lastSeen),
                    organizationId: profile.organization_id ?? undefined,
                } as Member
            }))

            setMembers(members)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load team')
        } finally {
            setLoading(false)
        }
    }

    async function updateMember(id: string, updates: { role?: string; is_active?: boolean }) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
        if (error) throw new Error(error.message)
        await load()
    }

    useEffect(() => {
        load()
        const interval = setInterval(load, 180 * 1000) // refresh every 180 seconds
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { members, loading, error, updateMember, refresh: load }
}

function getThisMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}