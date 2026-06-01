/* =====================================================================
   Summit Securities — Certificate System Configuration
   ---------------------------------------------------------------------
   Edit the values in this file to customize the system. Most changes
   you'll ever need to make live right here.
   ===================================================================== */

window.SUMMIT_CONFIG = {
  /* ---- Company ---- */
  companyName: "Summit Securities",
  companyTagline: "Brokerage & Proprietary Trading",

  /* ---- Brand assets (relative paths inside /assets) ----
     `logo`       — dark wordmark, used in the light app interface.
     `logoOnDark` — white wordmark, used on the dark certificate itself.
     `sealEmblem` — small monogram in the center of the security seal.   */
  logo: "assets/logo.png",
  logoOnDark: "assets/logo-white.png",
  sealEmblem: "assets/monogram-white.png",

  /* ---- Signatories (appear at the bottom of every certificate) ---- */
  signatories: {
    left: {
      name: "Shawn Manison",
      title: "Head of Risk & Compliance",
      signatureImage: "assets/signature-risk.png" // white-on-transparent script
    },
    right: {
      name: "Thomas Richmond",
      title: "Chief Executive Officer",
      signatureImage: "assets/signature-ceo.png"  // white-on-transparent script
    }
  },

  /* ---- Certificate types ----
     `code` is the 2-letter tag used inside the verification number.
     `{name}` and `{amount}` are replaced automatically in the body.   */
  certificateTypes: {
    payout: {
      label: "Withdrawal Certificate",
      code: "WD",
      heading: "Certificate of Withdrawal",
      body: "This certificate is proudly presented to {name} in recognition of a successfully processed withdrawal of {amount} from their funded trading account.",
      accent: "#c9a227"
    },
    trade: {
      label: "Trade Certificate",
      code: "TR",
      heading: "Certificate of Achievement",
      body: "This certificate is proudly presented to {name} in recognition of successfully completing a milestone trade valued at {amount}.",
      accent: "#2f7d5b"
    },
    crypto: {
      label: "Crypto Withdrawal Certificate",
      code: "CW",
      heading: "Certificate of Withdrawal",
      body: "This certificate is proudly presented to {name} in recognition of a successful cryptocurrency profit withdrawal of {amount} from Summit Securities.",
      accent: "#c9772a"
    }
  },

  /* ---- Currency formatting default ---- */
  defaultCurrency: "USD"
};
