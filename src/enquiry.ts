export const enquiryLimits = { name: 100, email: 254, message: 2000 };

export type EnquiryError = {
  code: string;
  message: string;
  fields?: Partial<Record<keyof typeof enquiryLimits, string>>;
};

export type EnquiryResponse = { status: "accepted" } | { error: EnquiryError };
