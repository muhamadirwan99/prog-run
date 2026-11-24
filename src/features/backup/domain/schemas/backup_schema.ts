import { z } from 'zod';

/**
 * Skema Validasi Backup `.json` menggunakan Zod.
 *
 * Analogi Flutter: mirip validasi ketat pada `fromJson()` agar file JSON rusak/salah format
 * tidak menyebabkan runtime crash atau merusak database lokal.
 *
 * Keunggulan:
 * Mendukung 2 versi sekaligus:
 * - `version: 2` (format baru aplikasi ini: `activities` dan `routes` terpisah)
 * - `version: 1` (format lama dari prototype `prog-run.html`: `coords` menempel di activity)
 */

const geoPointSchema = z.tuple([z.number(), z.number()]);

const splitSchema = z.object({
  km: z.union([z.number(), z.string()]),
  distanceKm: z.number(),
  timeSec: z.number(),
  paceSecPerKm: z.number(),
  eleDelta: z.number().default(0),
  isPartial: z.boolean().optional(),
});

const quarterMilestonesSchema = z.record(
  z.string(),
  z.tuple([z.boolean(), z.boolean(), z.boolean()]),
);

const programStateBackupSchema = z.object({
  activeQuarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  quarterMilestones: quarterMilestonesSchema.optional(),
  weeklyChecklist: z.record(z.string(), z.boolean()).optional(),
});

const activityItemSchema = z
  .object({
    // Terima `stravaActivityId` (v2) maupun `id` (v1 prototype)
    stravaActivityId: z.string().min(1).optional(),
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1),
    dateIso: z.string().min(1),
    distanceKm: z.number().positive(),
    movingTimeSec: z.number().positive(),
    paceSecPerKm: z.number().positive(),
    elevationGain: z.number().default(0),
    hasGpx: z.boolean().default(false),
    sourceFile: z.string().default('backup.json'),
    splits: z.array(splitSchema).default([]),
    coords: z.array(geoPointSchema).optional(),
    updatedAt: z.string().optional(),
  })
  .refine((val) => Boolean(val.stravaActivityId || val.id !== undefined), {
    message: 'Setiap aktivitas wajib memiliki stravaActivityId atau id.',
  });

const routeItemSchema = z.object({
  stravaActivityId: z.string().min(1),
  coords: z.array(geoPointSchema),
  pointCount: z.number().optional(),
  updatedAt: z.string().optional(),
});

export const backupFileSchema = z.object({
  app: z.string().optional(),
  version: z.union([z.literal(1), z.literal(2)]).default(2),
  exportedAt: z.string().optional(),
  includesRoutes: z.boolean().optional(),
  activities: z.array(activityItemSchema).default([]),
  routes: z.array(routeItemSchema).optional(),
  programState: programStateBackupSchema.optional(),
});

export type ValidatedBackupPayload = z.infer<typeof backupFileSchema>;
