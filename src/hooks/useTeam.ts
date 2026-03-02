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

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (error) throw new Error(error.message)

            // For each member, fetch their hours
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
                    supabase
                        .from('project_members')
                        .select('project_id')
                        .eq('user_id', profile.id),
                ])

                const weekMins = (weekRes.data ?? []).reduce((s, e) => s + e.duration_minutes, 0)
                const monthMins = (monthRes.data ?? []).reduce((s, e) => s + e.duration_minutes, 0)
                const projectCount = (projectRes.data ?? []).length

                return {
                    id: profile.id,
                    name: profile.full_name,
                    initials: profile.initials,
                    color: profile.color,
                    role: profile.role,
                    email: profile.email ?? '',
                    status: 'active' as const,
                    weekHours: Math.round((weekMins / 60) * 10) / 10,
                    monthHours: Math.round((monthMins / 60) * 10) / 10,
                    projects: projectCount,
                    lastActive: 'Active now',
                } as Member
            }))

            setMembers(members)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load team')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { members, loading, error }
}

function getThisMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}