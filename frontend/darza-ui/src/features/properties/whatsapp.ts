interface InquiryDetails {
  title: string
  townName: string
  cityName: string
  url: string
}
export function buildInquiryMessage({ title, townName, cityName, url }: InquiryDetails): string {
  return `مرحبا، أنا مهتم بإعلانك في درزة:\n${title}\nالمنطقة: ${townName}، ${cityName}\nالرابط: ${url}\nهل ما زال متاحًا؟`
}
