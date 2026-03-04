const n=n=>null==n?"₹0.00":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);export{n as f};
