'use server';

import { revalidatePath } from 'next/cache'
import * as data from './data'
import { suggestTvGroupAssignment } from '@/ai/flows/ai-tv-group-assignment'
import type { Ad, PriorityStream } from './definitions'

export async function createGroupAction(name: string) {
  try {
    await data.createGroup(name);
    revalidatePath('/')
    revalidatePath('/dashboard');
    return { success: true, message: `Group "${name}" created.` }
  } catch (error) {
    return { success: false, message: "Failed to create group." }
  }
}

export async function registerTvAction(tvId: string, name: string) {
    try {
        const existingTv = await data.getTvById(tvId);
        if (existingTv) {
            return { success: false, message: 'A TV with this ID is already registered.' };
        }
        await data.createTv(tvId, name);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/tvs');
        return { success: true, message: `TV "${name}" registered successfully.` };
    } catch (error) {
        return { success: false, message: 'Failed to register TV.' };
    }
}

export async function updateTvNameAction(tvId: string, name: string) {
  try {
    await data.updateTv(tvId, { name });
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/tvs');
    revalidatePath(`/groups/`) // Also revalidate any group pages
    return { success: true, message: `TV name updated to "${name}".` }
  } catch (error) {
    return { success: false, message: "Failed to update TV name." }
  }
}

export async function assignTvToGroupAction(tvId: string, groupId: string | null) {
  try {
    await data.updateTv(tvId, { groupId });
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/tvs');
    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    // Revalidate all group pages since TV might have moved from another group
    const groups = await data.getGroups();
    groups.forEach(g => revalidatePath(`/groups/${g.id}`));

    return { success: true, message: `TV assigned successfully.` }
  } catch (error) {
    return { success: false, message: "Failed to assign TV." }
  }
}

export async function updateGroupTvsAction(groupId: string, tvIds: string[]) {
    try {
        await data.updateGroupTvs(groupId, tvIds);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Group TVs updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update group TVs.' };
    }
}

export async function updateGroupAdsAction(groupId: string, ads: Ad[]) {
    try {
        await data.updateGroupAds(groupId, ads);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Ad playlist updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update ad playlist.' };
    }
}

export async function startPriorityStreamAction(groupId: string, stream: PriorityStream) {
    try {
        await data.updatePriorityStream(groupId, stream);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream started.' };
    } catch (error) {
        return { success: false, message: 'Failed to start priority stream.' };
    }
}

export async function stopPriorityStreamAction(groupId: string) {
    try {
        await data.updatePriorityStream(groupId, null);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream stopped.' };
    } catch (error) {
        return { success: false, message: 'Failed to stop priority stream.' };
    }
}

export async function getAiGroupSuggestion(tvName: string, existingGroupNames: string[]) {
    try {
        const result = await suggestTvGroupAssignment({
            tvName,
            existingGroupNames,
        });
        return { success: true, data: result };
    } catch (error) {
        console.error("AI suggestion failed:", error);
        return { success: false, message: 'AI suggestion service is unavailable.' };
    }
}

export async function setTvOnlineAction(tvId: string, isOnline: boolean) {
    try {
        await data.setTvOnlineStatus(tvId, isOnline);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/tvs');
        
        // Find the TV to revalidate its group page if it has one
        const tv = await data.getTvById(tvId);
        if (tv?.groupId) {
            revalidatePath(`/groups/${tv.groupId}`);
        }
        
        return { success: true, message: `TV status updated.` };
    } catch (error) {
        return { success: false, message: 'Failed to update TV status.' };
    }
}
