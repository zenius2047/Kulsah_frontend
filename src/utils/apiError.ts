import { AxiosError } from 'axios';

export type ApiValidationErrors = Record<string, string[]>;

export type ParsedApiError = {
  status?: number;
  title: string;
  message: string;
  validationErrors?: ApiValidationErrors;
};

const flattenValidationErrors = (errors: unknown): ApiValidationErrors | undefined => {
  if (!errors || typeof errors !== 'object') return undefined;

  return Object.entries(errors as Record<string, unknown>).reduce<ApiValidationErrors>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((item) => String(item));
      return acc;
    }

    if (value != null) {
      acc[key] = [String(value)];
    }

    return acc;
  }, {});
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const axiosError = error as AxiosError<any>;
  const status = axiosError?.response?.status;
  const data = axiosError?.response?.data;
  const backendMessage = typeof data?.message === 'string' ? data.message : undefined;
  const validationErrors = flattenValidationErrors(data?.errors);

  if (status === 401) {
    return { status, title: 'Session expired', message: backendMessage || 'Please sign in again.' };
  }

  if (status === 403) {
    return { status, title: 'Not allowed', message: backendMessage || 'You do not have access to this action.' };
  }

  if (status === 404) {
    return { status, title: 'Not found', message: backendMessage || 'We could not find that resource.' };
  }

  if (status === 422) {
    const firstValidationMessage = validationErrors
      ? Object.values(validationErrors).flat().find(Boolean)
      : undefined;

    return {
      status,
      title: 'Check your details',
      message: firstValidationMessage || backendMessage || 'Some fields need your attention.',
      validationErrors,
    };
  }

  if (status === 500) {
    return { status, title: 'Server error', message: backendMessage || 'Something went wrong on the server.' };
  }

  return {
    status,
    title: 'Request failed',
    message: backendMessage || axiosError?.message || 'Please try again.',
    validationErrors,
  };
};

export const getApiErrorMessage = (error: unknown) => parseApiError(error).message;

