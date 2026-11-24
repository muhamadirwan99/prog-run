/**
 * Konstanta Masterplan 12 Bulan: Road to 10K Sub-60.
 * Kamu bisa mengedit target pace, daftar gerakan kalistenik, atau jadwal tiap kuartal
 * langsung dari file ini tanpa perlu menyentuh kode UI.
 */

export const BASELINE_PACE_SEC = 600; // 10:00 /km (baseline awal 4 km)
export const TARGET_PACE_SEC = 360; // 6:00 /km (target akhir 10 km < 60 menit)
export const TARGET_DISTANCE_KM = 10.0;
export const TARGET_10K_SECONDS = 3600; // 60 menit

export type QuarterId = 1 | 2 | 3 | 4;

export interface TrainingTask {
  id: string;
  title: string;
  desc: string;
}

export interface QuarterPlan {
  id: QuarterId;
  months: string;
  title: string;
  targetBadge: string;
  targetPaceSec: number;
  color: 'lime' | 'cyan' | 'emerald' | 'amber';
  description: string;
  milestones: [string, string, string];
  saturdayTasks: TrainingTask[];
  sundayTasks: TrainingTask[];
}

export interface CalisthenicsExercise {
  id: string;
  name: string;
  setsReps: string;
  cue: string;
  /** Jika terisi (detik), muncul tombol cepat untuk langsung menjalankan timer kalistenik */
  timerSec: number | null;
}

export const QUARTERS_CONFIG: QuarterPlan[] = [
  {
    id: 1,
    months: 'Bulan 1–3',
    title: 'Adaptasi Impak Aspal & Kunci 5K',
    targetBadge: '5 KM Nonstop @ 9:00–9:30 /km',
    targetPaceSec: 555,
    color: 'lime',
    description:
      'Transisi aman dari baseline 4 km (pace 10:00) ke 5 km nonstop tanpa cedera shin splints maupun nyeri lutut.',
    milestones: [
      'Lari 30 menit nonstop tanpa jalan kaki',
      'Menyelesaikan 5.0 km perdana pace ≤ 9:30/km',
      'Rutin Kalistenik Selasa 4 minggu berturut-turut',
    ],
    saturdayTasks: [
      {
        id: 'sat_q1_1',
        title: 'Pemanasan Dinamis & Engkel Mobility (10 Menit)',
        desc: 'Leg swings, ankle circles, high knees ringan sebelum lari.',
      },
      {
        id: 'sat_q1_2',
        title: 'Run-Walk Interval 6 x (4 Menit Lari / 1 Menit Jalan)',
        desc: 'Jaga pace lari nyaman di 8:45–9:15/km dengan napas teratur.',
      },
      {
        id: 'sat_q1_3',
        title: '4 x 15 Detik Cadence Drill Ringan',
        desc: 'Fokus langkah pendek cepat di tempat datar, bukan sprint penuh.',
      },
    ],
    sundayTasks: [
      {
        id: 'sun_q1_1',
        title: 'Easy Long Run 4.0 – 5.0 KM Nonstop',
        desc: 'Target pace konstan 9:00–9:30/km (Zona 2/3 bisa ngobrol).',
      },
      {
        id: 'sun_q1_2',
        title: 'Evaluasi Postur & Pendaratan Kaki',
        desc: 'Pastikan mendarat lembut di bawah panggul (tidak overstriding).',
      },
      {
        id: 'sun_q1_3',
        title: 'Pendinginan & Stretching Betis/Hamstring (10 Menit)',
        desc: 'Tahan tiap regangan 30 detik seusai Long Run.',
      },
    ],
  },
  {
    id: 2,
    months: 'Bulan 4–6',
    title: 'Efisiensi Cadence & Tembus Sub-8',
    targetBadge: '5 KM Pace < 8:00 /km (< 40 Menit)',
    targetPaceSec: 475,
    color: 'cyan',
    description:
      'Meningkatkan frekuensi langkah (cadence 168–175 spm) dan ekonomi lari agar pace turun drastis tanpa menguras detak jantung.',
    milestones: [
      'Rata-rata cadence mencapai ≥ 168 spm',
      'Menyelesaikan 5.0 km di bawah 40 menit (Pace < 8:00)',
      'Long Run hari Minggu mencapai jarak 6.5 km',
    ],
    saturdayTasks: [
      {
        id: 'sat_q2_1',
        title: 'Drills ABC: A-Skip, B-Skip & High Cadence (12 Menit)',
        desc: 'Aktivasi pegas tendon Achilles & ritme langkah 170 spm.',
      },
      {
        id: 'sat_q2_2',
        title: 'Interval 6 x 400m @ Pace 7:15–7:30/km (Rest 90 dtk)',
        desc: 'Jaga kecepatan stabil dari repetisi pertama hingga keenam.',
      },
      {
        id: 'sat_q2_3',
        title: 'Cool-down Jogging 1 KM + Foam Roll / Pijat Betis',
        desc: 'Turunkan detak jantung perlahan setelah sesi kecepatan.',
      },
    ],
    sundayTasks: [
      {
        id: 'sun_q2_1',
        title: 'Long Run Progresif 5.5 – 7.0 KM',
        desc: 'Mulai di pace 8:30/km dan tutup 2 km terakhir di pace 7:50/km.',
      },
      {
        id: 'sun_q2_2',
        title: 'Latihan Ritme Napas 3:2 atau 2:2',
        desc: 'Tarik napas 3 langkah, buang 2 langkah untuk suplai oksigen optimal.',
      },
      {
        id: 'sun_q2_3',
        title: 'Hidrasi Elektrolit & Evaluasi Split di Tracker',
        desc: 'Unggah arsip Strava ke Road to 10K Tracker dan cek konsistensi split.',
      },
    ],
  },
  {
    id: 3,
    months: 'Bulan 7–9',
    title: 'Penguasaan Jarak 10 KM Penuh',
    targetBadge: 'Finish 10 KM @ Pace 7:30–8:00 /km',
    targetPaceSec: 450,
    color: 'emerald',
    description:
      'Perluasan kapasitas aerobik dan ketahanan otot kaki untuk menyelesaikan jarak penuh 10 km dengan form yang tetap kokoh.',
    milestones: [
      'Long Run menembus jarak 8.0 km tanpa kram',
      'Finish 10.0 km perdana dengan nyaman',
      'Pace rata-rata 10 km berada di rentang 7:30–8:00/km',
    ],
    saturdayTasks: [
      {
        id: 'sat_q3_1',
        title: 'Pemanasan Jog 1.5 KM + Dynamic Mobility',
        desc: 'Persiapan otot untuk sesi Tempo Run menengah.',
      },
      {
        id: 'sat_q3_2',
        title: 'Tempo Run 4 KM Berkelanjutan @ Pace 7:00–7:15/km',
        desc: 'Berlari di ambang laktat (comfortably hard) dengan fokus penuh.',
      },
      {
        id: 'sat_q3_3',
        title: '4 x 100m Strides Cepat di Akhir Sesi',
        desc: 'Melatih rekrutmen serat otot cepat saat kaki mulai lelah.',
      },
    ],
    sundayTasks: [
      {
        id: 'sun_q3_1',
        title: 'Endurance Long Run 8.0 – 10.0 KM',
        desc: 'Pertahankan pace konstan 7:30–7:55/km sepanjang durasi lari.',
      },
      {
        id: 'sun_q3_2',
        title: 'Simulasi Nutrisi & Hidrasi Setiap 25 Menit',
        desc: 'Minum 150ml air/elektrolit agar performa km 7–10 tidak drop.',
      },
      {
        id: 'sun_q3_3',
        title: 'Cek Negative Split (Paruh Kedua Lebih Cepat)',
        desc: 'Pastikan Km 6–10 sama atau sedikit lebih cepat dari Km 1–5.',
      },
    ],
  },
  {
    id: 4,
    months: 'Bulan 10–12',
    title: 'Penajaman Pace 6:00 (Sub-60 Mastery)',
    targetBadge: 'TARGET UTAMA: 10 KM < 60 Menit (6:00/km)',
    targetPaceSec: 360,
    color: 'amber',
    description:
      'Fase puncak spesifisitas kecepatan: membiasakan tubuh berlari pada kecepatan 10 km/jam (pace 6:00/km) hingga tuntas 10 kilometer.',
    milestones: [
      '5K Time Trial tembus di bawah 28:30 (Pace 5:42/km)',
      'Sesi Tempo 7 KM terkunci rata di pace 5:58/km',
      'FINISH 10.0 KM DALAM WAKTU < 60 MENIT!',
    ],
    saturdayTasks: [
      {
        id: 'sat_q4_1',
        title: 'Pemanasan 1.5 KM + 4x Drills Reaktif',
        desc: 'Siapkan sistem kardiovaskular untuk kecepatan target Sub-60.',
      },
      {
        id: 'sat_q4_2',
        title: 'Interval Spesifik 5 x 1.000m @ Pace 5:45–5:55/km',
        desc: 'Istirahat jog ringan 2 menit antar kilometer; kunci ritme Sub-60.',
      },
      {
        id: 'sat_q4_3',
        title: 'Pendinginan 1 KM Easy Jog & Evaluasi Split',
        desc: 'Pastikan deviasi antar split 1 km kurang dari 5 detik.',
      },
    ],
    sundayTasks: [
      {
        id: 'sun_q4_1',
        title: 'Fast-Finish Long Run 9.0 – 10.5 KM',
        desc: '6 km pertama @ 6:25/km, lalu 4 km terakhir kunci di @ 5:55/km!',
      },
      {
        id: 'sun_q4_2',
        title: 'Mental Focus & Core Lock di Km 8–10',
        desc: 'Aktifkan perut (plank posture) dan ayunan tangan saat mulai berat.',
      },
      {
        id: 'sun_q4_3',
        title: 'Verifikasi Prediksi Riegel Sub-60 di Dashboard',
        desc: 'Pantau kurva Riegel hingga menembus angka ≤ 59:59.',
      },
    ],
  },
];

export const TUESDAY_CALISTHENICS: CalisthenicsExercise[] = [
  {
    id: 'tue_1',
    name: 'Eccentric Calf Raise',
    setsReps: '3 x 15 repetisi',
    cue: 'Jinjit 1 detik dengan dua kaki, tahan 1 detik di puncak, lalu turun perlahan 3 detik. Memperkuat tendon Achilles.',
    timerSec: null,
  },
  {
    id: 'tue_2',
    name: 'Tibialis Wall Raise',
    setsReps: '3 x 15 repetisi',
    cue: 'Sandarkan punggung ke tembok, tumit maju 30 cm, angkat ujung jari kaki setinggi mungkin. Anti shin-splints nomor satu.',
    timerSec: null,
  },
  {
    id: 'tue_3',
    name: 'Single-Leg Glute Bridge',
    setsReps: '3 x 12 / kaki',
    cue: 'Tidur telentang, angkat pinggul dengan satu kaki tumpuan. Mengaktifkan glutes & hamstring untuk dorongan lari.',
    timerSec: null,
  },
  {
    id: 'tue_4',
    name: 'Wall Sit Isometric',
    setsReps: '3 x 45 detik',
    cue: 'Duduk bersandar di tembok sudut lutut 90 derajat. Meredam impak lutut di aspal keras.',
    timerSec: 45,
  },
  {
    id: 'tue_5',
    name: 'Pogo Jumps Reaktif',
    setsReps: '3 x 30 detik',
    cue: 'Lompatan kecil cepat bertumpu pada bola kaki (lutut hampir lurus, engkel membal seperti pegas) untuk menaikkan cadence.',
    timerSec: 30,
  },
  {
    id: 'tue_6',
    name: 'Forearm Plank Core Lock',
    setsReps: '3 x 45 detik',
    cue: 'Kencangkan perut dan bokong lurus sejajar. Menjaga postur tetap tegak di kilometer ke-8 hingga ke-10.',
    timerSec: 45,
  },
];
