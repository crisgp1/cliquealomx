import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireClerkSuperAdmin } from "~/lib/auth-clerk.server";
import { ProspectModel } from "~/models/Prospect.server";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { SuperAdminProspectsBoard } from "~/components/admin/SuperAdminProspectsBoard";
import { usePermissions } from "~/hooks/useClerkRole";
import { getClerkClient } from "~/lib/clerk.server";
import { useEffect } from "react";

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkSuperAdmin(args);

  try {
    const clerkClient = getClerkClient();
    
    // Get all Clerk users (admins and superadmins who can create prospects)
    const allUsersResponse = await clerkClient.users.getUserList({ limit: 500 });
    const allClerkUsers = allUsersResponse.data;
    
    // Filter users who are admins or superadmins
    const adminUsers = allClerkUsers.filter(clerkUser => {
      const role = clerkUser.publicMetadata?.role as string;
      return role === 'admin' || role === 'superadmin';
    });

    // Get all prospects
    const prospects = await ProspectModel.findAll();
    
    // Create a map to store user stats
    const userStatsMap = new Map();
    
    // Initialize stats for all admin users
    adminUsers.forEach(clerkUser => {
      const role = clerkUser.publicMetadata?.role as string;
      userStatsMap.set(clerkUser.id, {
        userId: clerkUser.id,
        userName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || 'Usuario',
        userEmail: clerkUser.emailAddresses[0]?.emailAddress || '',
        userAvatar: clerkUser.imageUrl,
        userRole: role,
        totalProspects: 0,
        activeProspects: 0,
        convertedProspects: 0,
        discardedProspects: 0,
        conversionRate: 0,
        lastActivity: clerkUser.createdAt,
        prospectsByStatus: {
          new: 0,
          contacted: 0,
          appointment_scheduled: 0,
          qualified: 0,
          converted: 0,
          not_interested: 0,
        },
        weeklyProgress: [],
        createdAt: clerkUser.createdAt,
        lastSignInAt: clerkUser.lastSignInAt,
      });
    });
    
    // Calculate weekly progress data for each user
    const now = new Date();
    const weekBoundaries = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      return {
        week: `Sem ${4 - i}`,
        start: weekStart,
        end: weekEnd
      };
    });

    // Group prospects by the user who created them or assign them round-robin
    prospects.forEach((prospect: any, index: number) => {
      // Use createdBy field if available, otherwise assign round-robin for demo
      let assignedUserId = prospect.createdBy;
      
      // If no createdBy field or user not found in admin users, assign round-robin
      if (!assignedUserId || !adminUsers.find(user => user.id === assignedUserId)) {
        const adminUserIndex = index % adminUsers.length;
        assignedUserId = adminUsers[adminUserIndex]?.id;
      }
      
      if (assignedUserId && userStatsMap.has(assignedUserId)) {
        const userStats = userStatsMap.get(assignedUserId);
        userStats.totalProspects++;
        
        // Count by status
        if (userStats.prospectsByStatus[prospect.status] !== undefined) {
          userStats.prospectsByStatus[prospect.status]++;
        }
        
        // Categorize prospects
        if (prospect.status === 'converted') {
          userStats.convertedProspects++;
        } else if (prospect.status === 'not_interested') {
          userStats.discardedProspects++;
        } else {
          userStats.activeProspects++;
        }
        
        // Update last activity based on prospect updates
        const prospectDate = new Date(prospect.updatedAt);
        if (prospectDate > new Date(userStats.lastActivity)) {
          userStats.lastActivity = prospectDate.toISOString();
        }

        // Calculate weekly progress
        weekBoundaries.forEach(week => {
          const prospectCreatedAt = new Date(prospect.createdAt);
          if (prospectCreatedAt >= week.start && prospectCreatedAt < week.end) {
            let weekData = userStats.weeklyProgress.find(wp => wp.week === week.week);
            if (!weekData) {
              weekData = { week: week.week, prospects: 0, conversions: 0 };
              userStats.weeklyProgress.push(weekData);
            }
            weekData.prospects++;
            if (prospect.status === 'converted') {
              weekData.conversions++;
            }
          }
        });
      }
    });
    
    // Calculate final stats and format data
    const usersStats = Array.from(userStatsMap.values()).map((userStat: any) => {
      // Calculate conversion rate
      userStat.conversionRate = userStat.totalProspects > 0 
        ? Math.round((userStat.convertedProspects / userStat.totalProspects) * 100)
        : 0;
      
      // Ensure all weeks are present in weeklyProgress
      weekBoundaries.forEach(week => {
        if (!userStat.weeklyProgress.find(wp => wp.week === week.week)) {
          userStat.weeklyProgress.push({ week: week.week, prospects: 0, conversions: 0 });
        }
      });
      
      // Sort weekly progress by week
      userStat.weeklyProgress.sort((a, b) => {
        const weekA = parseInt(a.week.split(' ')[1]);
        const weekB = parseInt(b.week.split(' ')[1]);
        return weekA - weekB;
      });
      
      // Format last activity
      userStat.lastActivity = new Date(userStat.lastActivity).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return userStat;
    });

    // Sort by total prospects (most active first)
    usersStats.sort((a, b) => b.totalProspects - a.totalProspects);

    return json({ usersStats });
    
  } catch (error) {
    console.error('Error loading super admin prospects data:', error);
    
    // Fallback in case of Clerk API issues
    return json({ 
      usersStats: [],
      error: 'Error loading user data. Please try again later.'
    });
  }
}

export default function SuperAdminProspectosPage() {
  const { usersStats, error } = useLoaderData<typeof loader>();
  const permissions = usePermissions();

  // Client-side permission check as additional security
  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      window.location.href = '/admin/prospectos';
    }
  }, [permissions.isSuperAdmin]);

  if (!permissions.isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">Solo los super administradores pueden acceder a esta página.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SuperAdminProspectsBoard usersStats={usersStats} error={error} />
    </AdminLayout>
  );
}