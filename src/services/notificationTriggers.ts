import { dispatchNotification } from './notificationService';

export async function notifyUserFollowed(params: {
  followerName: string;
  followerId: string;
  targetUserId: string;
}) {
  const { followerName, followerId, targetUserId } = params;
  await dispatchNotification({
    userId: targetUserId,
    title: `${followerName} is now following you`,
    body: 'Visit their profile to follow back or see their latest WIGGs.',
    data: { url: `/profile/${followerId}` },
    channels: ['in_app', 'push', 'email'],
  });
}

export async function notifyWiggLiked(params: {
  likerName: string;
  ownerUserId: string;
  mediaTitle?: string;
  wiggPointId: string;
}) {
  const { likerName, ownerUserId, mediaTitle, wiggPointId } = params;
  await dispatchNotification({
    userId: ownerUserId,
    title: `${likerName} appreciated your WIGG`,
    body: mediaTitle ? `${likerName} liked your WIGG for ${mediaTitle}.` : `${likerName} liked one of your WIGG points.`,
    data: { url: `/wigg/${wiggPointId}` },
    channels: ['in_app', 'push'],
  });
}

export async function notifyT2gUpdate(params: {
  userId: string;
  mediaTitle: string;
  newLabel: string;
  mediaId: string;
}) {
  const { userId, mediaTitle, newLabel, mediaId } = params;
  await dispatchNotification({
    userId,
    title: `New T2G insight for ${mediaTitle}`,
    body: `Community consensus shifted to ${newLabel}.`,
    data: { url: `/media/${mediaId}` },
    channels: ['in_app', 'email'],
  });
}
