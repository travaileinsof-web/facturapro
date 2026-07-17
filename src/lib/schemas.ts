import { z } from 'zod';

// --- AUTHENTICATION SCHEMAS ---

export const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  company: z.string().min(2, "Le nom de l'entreprise est requis"),
  password: z.string().min(6, "Minimum 6 caractères requis"),
  confirm: z.string()
}).refine((data) => data.password === data.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
});

export type RegisterData = z.infer<typeof registerSchema>;

// --- ADMIN SCHEMAS ---

export const accountSchema = z.object({
  id: z.string().or(z.number()),
  company_name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  subscription_end: z.string().optional().nullable(),
  // Permettre d'autres champs sans crasher
}).passthrough();

export const adminAccountsResponseSchema = z.array(accountSchema);

export const adminStatsSchema = z.object({
  total_users: z.number().optional(),
  active_subscriptions: z.number().optional(),
  monthly_revenue: z.number().optional(),
  total_revenue: z.number().optional(),
  new_users_month: z.number().optional(),
  churn_rate: z.number().optional(),
  revenue_data: z.array(z.any()).optional(),
}).passthrough();
