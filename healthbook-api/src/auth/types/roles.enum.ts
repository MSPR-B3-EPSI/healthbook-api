export enum Role {
  Freemium = 'plan-freemium',
  Premium = 'plan-premium',
  PremiumPlus = 'plan-premium-plus',
}

export const ROLE_HIERARCHY: Role[] = [
  Role.Freemium,
  Role.Premium,
  Role.PremiumPlus,
];
