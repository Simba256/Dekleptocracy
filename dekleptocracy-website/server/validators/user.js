import { z } from 'zod/v4';

const US_STATES = [
  'nationwide',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(1).max(100).optional(),
      preferences: z.union([z.string(), z.object({}).passthrough()]).optional(),
    })
    .passthrough(), // Allow multer fields
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    selectedState: z.enum(US_STATES).optional(),
    defaultTimePeriod: z.enum(['YoY', '3 months', '30 days']).optional(),
    conversationStyles: z.array(z.string()).optional(),
    topicsOfInterest: z.array(z.string()).optional(),
    householdExpenseFocus: z.string().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
