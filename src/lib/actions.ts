'use server';

import { revalidatePath } from 'next/cache'
import * as data from './data'
import { suggestTvGroupAssignment } from '@/ai/flows/ai-tv-group-assignment'
import type { Ad, Playlist, PriorityStream, TV } from './definitions'
import { notifyTv, notifyGroup } from './ws-notifications';


// --- Group Actions ---

export async function createGroupAction(name: string) {
  try {
    await data.createGroup(name);
    revalidatePath('/groups');
    revalidatePath('/dashboard');
    return { success: true, message: `Group "${name}" created.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create group."
    return { success: false, message }
  }
}

export async function deleteGroupAction(groupId: string) {
    try {
        const tvsInGroup = await data.getTvsByGroupId(groupId);
        if (tvsInGroup.length > 0) {
            return { success: false, message: "Cannot delete a group that has TVs assigned to it." };
        }
        await data.deleteGroup(groupId);
        revalidatePath('/groups');
        return { success: true, message: "Group deleted successfully." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete group."
        return { success: false, message };
    }
}

export async function updateGroupTvsAction(groupId: string, tvIds: string[]) {
    try {
        // Find which TVs were removed to notify them
        const originalTvs = await data.getTvsByGroupId(groupId);
        const originalTvIds = originalTvs.map(tv => tv.tvId);
        
        await data.updateGroupTvs(groupId, tvIds);

        const allAffectedIds = new Set([...originalTvIds, ...tvIds]);
        allAffectedIds.forEach(tvId => notifyTv(tvId));

        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/groups');
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Group TVs updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update group TVs.'
        return { success: false, message };
    }
}

export async function updateGroupPlaylistAction(groupId: string, playlistId: string | null) {
    try {
        await data.updateGroup(groupId, { playlistId });
        notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Group playlist updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update playlist.'
        return { success: false, message };
    }
}


// --- TV Actions ---

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
        const message = error instanceof Error ? error.message : 'Failed to register TV.'
        return { success: false, message };
    }
}

export async function updateTvNameAction(tvId: string, name: string) {
  try {
    await data.updateTv(tvId, { name });
    notifyTv(tvId);
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/tvs');
    revalidatePath(`/groups/`) // Also revalidate any group pages
    return { success: true, message: `TV name updated to "${name}".` }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update TV name."
    return { success: false, message }
  }
}

export async function assignTvToGroupAction(tvId: string, groupId: string | null) {
  try {
    await data.updateTv(tvId, { groupId });
    notifyTv(tvId);

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/tvs');
    revalidatePath('/groups');
    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    const groups = await data.getGroups();
    if (groups) {
      groups.forEach(g => revalidatePath(`/groups/${g.id}`));
    }

    return { success: true, message: `TV assigned successfully.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign TV."
    return { success: false, message }
  }
}

export async function setTvOnlineAction(tvId: string, isOnline: boolean) {
    try {
        await data.setTvOnlineStatus(tvId, isOnline, null); // Let the websocket server handle the socketId
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
        const message = error instanceof Error ? error.message : 'Failed to update TV status.'
        return { success: false, message };
    }
}

export async function deleteTvAction(tvId: string) {
    try {
        await data.deleteTv(tvId);
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/tvs');
        revalidatePath('/groups');
        const groups = await data.getGroups();
        if (groups) {
          groups.forEach(g => revalidatePath(`/groups/${g.id}`));
        }
        return { success: true, message: 'TV deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete TV.'
        return { success: false, message };
    }
}

// --- Priority Stream Actions ---

export async function startPriorityStreamAction(groupId: string, stream: PriorityStream) {
    try {
        await data.updatePriorityStream(groupId, stream);
        notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream started.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start priority stream.'
        return { success: false, message };
    }
}

export async function stopPriorityStreamAction(groupId: string) {
    try {
        await data.updatePriorityStream(groupId, null);
        notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`);
        return { success: true, message: 'Priority stream stopped.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to stop priority stream.'
        return { success: false, message };
    }
}


// --- Ad & Playlist Actions ---

export async function createAdAction(name: string, type: 'image' | 'video', url: string, duration?: number) {
    try {
        await data.createAd(name, type, url, duration);
        revalidatePath('/ads');
        revalidatePath('/playlists'); // Revalidate all playlist pages
        return { success: true, message: 'Ad created successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create ad.'
        return { success: false, message };
    }
}

export async function deleteAdAction(adId: string) {
    try {
        await data.deleteAd(adId);

        const playlists = await data.getPlaylists();
        const affectedGroups: Set<string> = new Set();
        if (playlists) {
            for (const playlist of playlists) {
                if (playlist.adIds.includes(adId)) {
                    // This playlist is affected. Find groups using it.
                    const groups = await data.getGroupsByPlaylistId(playlist.id);
                    groups.forEach(group => affectedGroups.add(group.id));
                }
            }
        }
        
        affectedGroups.forEach(groupId => notifyGroup(groupId));

        revalidatePath('/ads');
        revalidatePath('/playlists');
        if (playlists) {
            playlists.forEach(p => revalidatePath(`/playlists/${p.id}`));
        }

        return { success: true, message: 'Ad deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete ad.'
        return { success: false, message };
    }
}

export async function createPlaylistAction(name: string) {
    try {
        await data.createPlaylist(name);
        revalidatePath('/playlists');
        revalidatePath('/groups');
        return { success: true, message: `Playlist "${name}" created.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create playlist.'
        return { success: false, message };
    }
}

export async function deletePlaylistAction(playlistId: string) {
    try {
        const groups = await data.getGroupsByPlaylistId(playlistId);
        
        await data.deletePlaylist(playlistId);
        
        groups.forEach(group => notifyGroup(group.id));
        
        revalidatePath('/playlists');
        revalidatePath('/groups');
        return { success: true, message: 'Playlist deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete playlist.'
        return { success: false, message };
    }
}

export async function updatePlaylistAdsAction(playlistId: string, adIds: string[]) {
    try {
        await data.updatePlaylist(playlistId, { adIds });
        const groups = await data.getGroupsByPlaylistId(playlistId);
        groups.forEach(group => notifyGroup(group.id));
        revalidatePath(`/playlists/${playlistId}`);
        return { success: true, message: 'Playlist updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update playlist.'
        return { success: false, message };
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