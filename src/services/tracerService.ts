import { TracerSubmissionPayload, SubmissionResponse } from '@/types/tracer';

/**
 * Retrieve the current access token from authStore (Zustand persisted state).
 * Reads directly from localStorage to avoid circular imports.
 */
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('alumni_auth_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Service to handle Tracer Study submission
 * Method: POST
 * Path: /api/v1/tracer-study
 *
 * Always submits to the real backend via Vite proxy (/api/v1/...).
 * Requires a valid JWT access token stored in authStore.
 */
export async function submitTracerStudy(
  payload: TracerSubmissionPayload & { agreement: boolean }
): Promise<SubmissionResponse> {
  // Light client-side check — only reject if critical required fields are missing
  // (Full validation is handled by the backend Zod schema)
  if (!payload.status_kegiatan) {
    return { success: false, message: 'Status kegiatan wajib dipilih.' };
  }
  if (!payload.evaluasi?.kompetensi_bermanfaat?.length) {
    return { success: false, message: 'Pilih minimal satu kompetensi yang bermanfaat.' };
  }
  if (!payload.agreement) {
    return { success: false, message: 'Anda harus menyetujui pernyataan kebenaran data.' };
  }

  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch('/api/v1/tracer-study', {
      method: 'POST',
      headers,
      credentials: 'include', // also send httpOnly cookies as fallback
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // 401 Unauthorized
      if (res.status === 401) {
        return {
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        };
      }

      // 409 Conflict — already submitted
      if (res.status === 409) {
        return {
          success: false,
          message: data?.message ?? 'Anda sudah pernah mengisi kuesioner tracer study.',
        };
      }

      return {
        success: false,
        message: data?.message ?? `Gagal mengirim data (HTTP ${res.status}).`,
        errors: data?.errors,
      };
    }

    // Backend returns { success, message, data: { submissionId, submittedAt, submission_id, submitted_at } }
    return {
      success: true,
      message: data?.message ?? 'Data tracer study berhasil disimpan.',
      data: {
        submission_id: data?.data?.submissionId ?? data?.data?.submission_id,
        submitted_at: data?.data?.submittedAt ?? data?.data?.submitted_at,
      },
    };
  } catch (err) {
    console.error('[TracerService] Network error:', err);
    return {
      success: false,
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
    };
  }
}
