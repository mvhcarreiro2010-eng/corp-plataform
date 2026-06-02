// Builds the Prisma where clause for content visibility segmentation.
// Empty arrays = no restriction. Non-empty = must match (AND across dimensions).
export function buildSegFilter(user: { id: string; buId?: string | null; role: string }) {
  return {
    AND: [
      { OR: [{ buIds: { isEmpty: true } }, ...(user.buId ? [{ buIds: { has: user.buId } }] : [])] },
      { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: user.role } }] },
      { OR: [{ userIds: { isEmpty: true } }, { userIds: { has: user.id } }] },
    ],
  }
}
