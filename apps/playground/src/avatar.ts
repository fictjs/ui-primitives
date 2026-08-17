export const avatarUrl = import.meta.env.PROD
  ? `${import.meta.env.BASE_URL}avatar.svg`
  : '/api/avatar'
