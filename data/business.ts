export const business = {
  name: "Yash Laser",
  established: 1997,
  whatsapp: "919427080400",
  phone: "+91 94270 80400",
  alternate: "+91 94274 94264",
  email: "yashlaser@gmail.com",
  address: "Swagat Residency, Kamalpur, Prantij, Sabarkantha, Gujarat 383205",
  url: "https://www.yashlaser.in",
};
export const whatsappUrl = (message: string) =>
  "https://wa.me/" + business.whatsapp + "?text=" + encodeURIComponent(message);
