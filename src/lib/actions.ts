'use server';

import { revalidatePath } from 'next/cache'
import * as data from './data'
import { suggestTvGroupAssignment } from '@/ai/flows/ai-tv-group-assignment'
import type { Ad, PriorityStream } from './definitions'

const DB_UNAVAILABLE_ERROR = "Database is not available. Please check your Firebase credentials.";

// --- Group Actions ---

export async function createGroupAction(name: string) {
  if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
  try {
    await data.createGroup(name);
    revalidatePath('/groups');
    revalidatePath('/dashboard');
    return { success: true, message: `Group "${name}" created.` }
  } catch (error) {
    return { success: false, message: "Failed to create group." }
  }
}

export async function deleteGroupAction(groupId: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        const tvsInGroup = await data.getTvsByGroupId(groupId);
        if (tvsInGroup.length > 0) {
            return { success: false, message: "Cannot delete a group that has TVs assigned to it." };
        }
        await data.deleteGroup(groupId);
        revalidatePath('/groups');
        return { success: true, message: "Group deleted successfully." };
    } catch (error) {
        return { success: false, message: "Failed to delete group." };
    }
}

export async function updateGroupTvsAction(groupId: string, tvIds: string[]) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.updateGroupTvs(groupId, tvIds);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/groups');
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Group TVs updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update group TVs.' };
    }
}

export async function updateGroupPlaylistAction(groupId: string, playlistId: string | null) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.updateGroup(groupId, { playlistId });
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Group playlist updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update playlist.' };
    }
}


// --- TV Actions ---

export async function registerTvAction(tvId: string, name: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
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
  if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
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
  if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
  try {
    await data.updateTv(tvId, { groupId });

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/tvs');
    revalidatePath('/groups');
    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    const groups = await data.getGroups();
    groups.forEach(g => revalidatePath(`/groups/${g.id}`));

    return { success: true, message: `TV assigned successfully.` }
  } catch (error) {
    return { success: false, message: "Failed to assign TV." }
  }
}

export async function setTvOnlineAction(tvId: string, isOnline: boolean) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.setTvOnlineStatus(tvId, isOnline);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/tvs');
        revalidatePath('/groups');
        
        const tv = await data.getTvById(tvId);
        if (tv?.groupId) {
            revalidatePath(`/groups/${tv.groupId}`);
        }
        
        return { success: true, message: `TV status updated.` };
    } catch (error) {
        return { success: false, message: 'Failed to update TV status.' };
    }
}

// --- Priority Stream Actions ---

export async function startPriorityStreamAction(groupId: string, stream: PriorityStream) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.updatePriorityStream(groupId, stream);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream started.' };
    } catch (error) {
        return { success: false, message: 'Failed to start priority stream.' };
    }
}

export async function stopPriorityStreamAction(groupId: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.updatePriorityStream(groupId, null);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream stopped.' };
    } catch (error) {
        return { success: false, message: 'Failed to stop priority stream.' };
    }
}


// --- Ad & Playlist Actions ---

export async function createAdAction(name: string, type: 'image' | 'video', url: string, duration?: number) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.createAd(name, type, url, duration);
        revalidatePath('/ads');
        revalidatePath('/playlists'); // Revalidate all playlist pages
        return { success: true, message: 'Ad created successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to create ad.' };
    }
}

export async function deleteAdAction(adId: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        // You might want to check if the ad is in any playlists before deleting
        await data.deleteAd(adId);
        revalidatePath('/ads');
        revalidatePath('/playlists');
        return { success: true, message: 'Ad deleted successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to delete ad.' };
    }
}

export async function createPlaylistAction(name: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        await data.createPlaylist(name);
        revalidatePath('/playlists');
        revalidatePath('/groups');
        return { success: true, message: `Playlist "${name}" created.` };
    } catch (error) {
        return { success: false, message: 'Failed to create playlist.' };
    }
}

export async function deletePlaylistAction(playlistId: string) {
    if (!db) return { success: false, message: DB_UNAVAILABLE_ERROR };
    try {
        // You might want to check if the playlist is used by any groups
        await data.deletePlaylist(playlistId);
        revalidatePath('/playlists');
        revalidatePath('/groups');
        return { success: true, message: 'Playlist deleted successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to delete playlist.' };
    }
}

export async function updatePlaylistAdsAction(playlistId: string, adIds: string[]) {
    if (!db) return { success: false, message: DBUNAVAILABLE_ERROR };
    try {
        await data.updatePlaylist(playlistId, { adIds });
        revalidatePath(`/playlists/${playlistId}`);
        return { success: true, message: 'Playlist updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update playlist.' };
    }
}

// --- AI Actions ---

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

import { db } from '@/lib/firebase';
