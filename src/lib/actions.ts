'use server';

import { revalidatePath } from 'next/cache'
import * as data from './data'
import { suggestTvGroupAssignment } from '@/ai/flows/ai-tv-group-assignment'
import type { Ad, Playlist, PriorityStream, TV } from './definitions'
import { notifyTv, notifyGroup, notifyStatusChange } from './ws-notifications';


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
        const originalTvs = await data.getTvsByGroupId(groupId);
        const originalTvIds = originalTvs.map(tv => tv.tvId);
        
        await data.updateGroupTvs(groupId, tvIds);

        const allAffectedIds = new Set([...originalTvIds, ...tvIds]);
        
        // Notify each affected TV individually
        for (const tvId of allAffectedIds) {
            await notifyTv(tvId);
        }

        revalidatePath('/', 'layout');
        return { success: true, message: 'Group TVs updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update group TVs.'
        return { success: false, message };
    }
}

export async function updateGroupPlaylistAction(groupId: string, playlistId: string | null) {
    try {
        await data.updateGroup(groupId, { playlistId });
        await notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`);
        revalidatePath('/groups');
        return { success: true, message: 'Group playlist updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update playlist.'
        return { success: false, message };
    }
}

export async function forceRefreshGroupAction(groupId: string) {
    try {
        await notifyGroup(groupId);
        return { success: true, message: 'Refresh signal sent to group.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send refresh signal.'
        return { success: false, message };
    }
}


// --- TV Actions ---

export async function registerTvAction(tvId: string, name: string, shopLocation?: string) {
    try {
        const sanitizedTvId = tvId.trim().replace(/\//g, '_');
        
        if (!sanitizedTvId) {
             return { success: false, message: 'TV ID cannot be empty.' };
        }

        const existingTv = await data.getTvById(sanitizedTvId);
        if (existingTv) {
            return { success: false, message: 'A TV with this ID is already registered.' };
        }

        await data.createTv(sanitizedTvId, name, shopLocation);
        
        await notifyTv(sanitizedTvId);

        revalidatePath('/', 'layout');
        return { success: true, message: `TV "${name}" registered successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to register TV.'
        return { success: false, message };
    }
}

export async function updateTvAction(tvId: string, tvData: Partial<Pick<TV, 'name' | 'shopLocation'>>) {
    try {
        await data.updateTv(tvId, tvData);
        await notifyTv(tvId);
        revalidatePath('/', 'layout');
        return { success: true, message: `TV details updated.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update TV."
        return { success: false, message }
    }
}


export async function assignTvToGroupAction(tvId: string, groupId: string | null) {
  try {
    const oldTvData = await data.getTvById(tvId);
    const oldGroupId = oldTvData?.groupId;

    await data.updateTv(tvId, { groupId });
    await notifyTv(tvId); // Notify the TV that was moved

    // Also notify the group it was removed from, if any
    if(oldGroupId) {
        await notifyGroup(oldGroupId);
    }
     // Also notify the group it was added to
    if (groupId) {
        await notifyGroup(groupId);
    }

    revalidatePath('/', 'layout');

    return { success: true, message: `TV assigned successfully.` }
  } catch (error)
   {
    const message = error instanceof Error ? error.message : "Failed to assign TV."
    return { success: false, message }
  }
}

export async function removeFromGroupAction(tvId: string) {
    try {
        const tv = await data.getTvById(tvId);
        if (tv?.groupId) {
            await assignTvToGroupAction(tvId, null);
            return { success: true, message: 'TV removed from group.' };
        }
        return { success: false, message: 'TV is not in a group.'};
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove TV from group.'
        return { success: false, message };
    }
}


export async function setTvOnlineStatusAction(tvId: string, isOnline: boolean) {
    try {
        await data.setTvOnlineStatus(tvId, isOnline);
        await notifyStatusChange({ tvId, isOnline });

        // Revalidate paths to update UI
        revalidatePath(`/dashboard`);
        revalidatePath(`/tvs`);
        revalidatePath(`/groups`);

        return { success: true, message: `TV status updated.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update TV status.'
        return { success: false, message };
    }
}

export async function deleteTvAction(tvId: string) {
    try {
        const tv = await data.getTvById(tvId);
        if (tv) {
            await notifyTv(tv.tvId);
        }
        await data.deleteTv(tvId);

        revalidatePath('/', 'layout');
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
        await notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`, 'page');
        return { success: true, message: 'Priority stream started.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start priority stream.'
        return { success: false, message };
    }
}

export async function stopPriorityStreamAction(groupId: string) {
    try {
        await data.updatePriorityStream(groupId, null);
        await notifyGroup(groupId);
        revalidatePath(`/groups/${groupId}`, 'page');
        return { success: true, message: 'Priority stream stopped.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to stop priority stream.'
        return { success: false, message };
    }
}


// --- Ad & Playlist Actions ---

export async function createAdAction(name: string, type: 'image' | 'video', url: string, duration?: number, tags?: string[]) {
    try {
        await data.createAd(name, type, url, duration, tags);
        revalidatePath('/ads');
        revalidatePath('/playlists', 'layout'); // Revalidate all playlist pages
        return { success: true, message: 'Ad created successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create ad.'
        return { success: false, message };
    }
}

export async function updateAdAction(adId: string, adData: Partial<Pick<Ad, 'name' | 'type' | 'url' | 'duration' | 'tags'>>) {
    try {
        await data.updateAd(adId, adData);

        const playlists = await data.getPlaylistsContainingAd(adId);
        const affectedGroups: Set<string> = new Set();
        if (playlists) {
            for (const playlist of playlists) {
                const groups = await data.getGroupsByPlaylistId(playlist.id);
                groups.forEach(group => affectedGroups.add(group.id));
            }
        }
        
        for (const groupId of affectedGroups) {
          await notifyGroup(groupId);
        }

        revalidatePath('/ads');
        revalidatePath('/playlists', 'layout');
        return { success: true, message: 'Ad updated successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update ad.'
        return { success: false, message };
    }
}

export async function deleteAdAction(adId: string) {
    try {
        const playlists = await data.getPlaylistsContainingAd(adId);
        const affectedGroups: Set<string> = new Set();
        if (playlists) {
            for (const playlist of playlists) {
                if (playlist.adIds.includes(adId)) {
                    const groups = await data.getGroupsByPlaylistId(playlist.id);
                    groups.forEach(group => affectedGroups.add(group.id));
                }
            }
        }
        
        await data.deleteAd(adId);
        
        for (const groupId of affectedGroups) {
          await notifyGroup(groupId);
        }

        revalidatePath('/ads');
        revalidatePath('/playlists', 'layout');


        return { success: true, message: 'Ad deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete ad.'
        return { success: false, message };
    }
}

export async function createPlaylistAction(name: string) {
    try {
        const playlist = await data.createPlaylist(name);
        revalidatePath('/playlists');
        if (playlist) {
             revalidatePath(`/playlists/${playlist.id}`);
        }
        revalidatePath('/groups', 'layout');
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
        
        for (const group of groups) {
          await notifyGroup(group.id);
        }
        
        revalidatePath('/playlists');
        revalidatePath('/groups', 'layout');
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
        
        for (const group of groups) {
          await notifyGroup(group.id);
        }

        revalidatePath(`/playlists/${playlistId}`);
        return { success: true, message: 'Playlist updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update playlist.';
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

// --- Analytics Actions ---

export async function setAnalyticsTrackingAction(isEnabled: boolean) {
    try {
        await data.setAnalyticsSettings({ isTrackingEnabled: isEnabled });
        revalidatePath('/analytics');
        return { success: true, message: `Ad tracking ${isEnabled ? 'enabled' : 'disabled'}.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update analytics settings.';
        return { success: false, message };
    }
}