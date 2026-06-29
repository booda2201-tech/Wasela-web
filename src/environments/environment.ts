// export const environment = {
//   production: false,
//   /** Production API (local backend on :7041 is optional). */
//   apiBaseUrl: 'https://waseela.somee.com/api',
//   apiOrigin: 'https://waseela.somee.com',
//   /** روابط المتاجر — املأها عند الجاهزية */
//   appStoreUrl: '',
//   googlePlayUrl: '',
// };





export const environment = {
  production: false,
  /** Local dev: requests go through proxy.conf.json → waseela.somee.com */
  apiBaseUrl: '/api',
  apiOrigin: 'https://waseela.somee.com',
  appStoreUrl: '',
  googlePlayUrl: '',
};