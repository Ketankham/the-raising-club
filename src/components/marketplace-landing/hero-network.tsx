/**
 * Decorative animated network diagram for the marketplace hero. Kept as a
 * verbatim static SVG (SMIL animation, no JS) from the reference design — the
 * markup is trusted and purely presentational, so it is injected as-is. CSS
 * vars from the reference are inlined to concrete hex since this page does not
 * declare them.
 */
const SVG = `
<svg viewBox="0 0 520 420" width="100%" style="max-width:520px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A network connecting parents, caregivers and organisations">
  <defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgb(184,167,157)"/></marker>
    <marker id="arr-mk" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgb(97,125,138)"/></marker>
    <marker id="arr-or" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgb(239,154,74)"/></marker>
    <marker id="arr-gr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgb(164,201,126)"/></marker>
  </defs>
  <path id="pc1" d="M 148 112 C 210 50 310 55 368 105" fill="none" stroke="rgb(97,125,138)" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#arr-mk)" opacity="0.7"/>
  <path id="pp" d="M 98 165 C 72 205 68 248 76 278" fill="none" stroke="rgb(239,154,74)" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#arr-or)" marker-start="url(#arr-or)" opacity="0.7"/>
  <path id="cc" d="M 418 148 C 444 182 448 222 440 262" fill="none" stroke="rgb(97,125,138)" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#arr-mk)" marker-start="url(#arr-mk)" opacity="0.5"/>
  <path id="pc2" d="M 113 295 C 195 325 340 315 428 285" fill="none" stroke="rgb(97,125,138)" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#arr-mk)" opacity="0.5"/>
  <path id="oc1" d="M 268 308 C 318 245 368 185 400 152" fill="none" stroke="rgb(164,201,126)" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#arr-gr)" opacity="0.7"/>
  <path id="oc2" d="M 296 332 C 360 322 412 305 428 284" fill="none" stroke="rgb(164,201,126)" stroke-width="1.5" stroke-dasharray="4 5" marker-end="url(#arr-gr)" opacity="0.5"/>
  <circle r="4" fill="rgb(97,125,138)" opacity="0.85"><animateMotion dur="4s" repeatCount="indefinite" begin="0s"><mpath href="#pc1"/></animateMotion></circle>
  <circle r="3.5" fill="rgb(239,154,74)" opacity="0.8"><animateMotion dur="5s" repeatCount="indefinite" begin="1s"><mpath href="#pp"/></animateMotion></circle>
  <circle r="3.5" fill="rgb(97,125,138)" opacity="0.6"><animateMotion dur="4.5s" repeatCount="indefinite" begin="0.5s"><mpath href="#cc"/></animateMotion></circle>
  <circle r="3.5" fill="rgb(97,125,138)" opacity="0.6"><animateMotion dur="5.5s" repeatCount="indefinite" begin="2s"><mpath href="#pc2"/></animateMotion></circle>
  <circle r="4" fill="rgb(164,201,126)" opacity="0.85"><animateMotion dur="4.2s" repeatCount="indefinite" begin="0.8s"><mpath href="#oc1"/></animateMotion></circle>
  <rect x="190" y="44" width="62" height="17" rx="8" fill="#e7f0f5"/>
  <text x="221" y="56" font-size="8.5" font-weight="700" fill="rgb(97,125,138)" font-family="inherit" text-anchor="middle">Find Care</text>
  <rect x="34" y="224" width="58" height="17" rx="8" fill="#fdf2e2"/>
  <text x="63" y="236" font-size="8.5" font-weight="700" fill="rgb(239,154,74)" font-family="inherit" text-anchor="middle">Playdates</text>
  <rect x="434" y="194" width="72" height="17" rx="8" fill="#e7f0f5"/>
  <text x="470" y="206" font-size="8.5" font-weight="700" fill="rgb(97,125,138)" font-family="inherit" text-anchor="middle">Peer Network</text>
  <rect x="198" y="322" width="62" height="17" rx="8" fill="#e7f0f5"/>
  <text x="229" y="334" font-size="8.5" font-weight="700" fill="rgb(97,125,138)" font-family="inherit" text-anchor="middle">Find Care</text>
  <rect x="308" y="224" width="34" height="17" rx="8" fill="#edf8e0"/>
  <text x="325" y="236" font-size="8.5" font-weight="700" fill="rgb(140,188,98)" font-family="inherit" text-anchor="middle">Hire</text>
  <circle cx="108" cy="128" fill="rgb(239,154,74)" opacity="0.12"><animate attributeName="r" values="44;56;44" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.12;0.04;0.12" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="406" cy="120" fill="rgb(97,125,138)" opacity="0.12"><animate attributeName="r" values="44;56;44" dur="3.5s" repeatCount="indefinite" begin="0.5s"/><animate attributeName="opacity" values="0.12;0.04;0.12" dur="3.5s" repeatCount="indefinite" begin="0.5s"/></circle>
  <circle cx="258" cy="336" fill="rgb(164,201,126)" opacity="0.12"><animate attributeName="r" values="40;52;40" dur="4s" repeatCount="indefinite" begin="1s"/><animate attributeName="opacity" values="0.12;0.04;0.12" dur="4s" repeatCount="indefinite" begin="1s"/></circle>
  <g>
    <circle cx="108" cy="128" r="44" fill="rgb(253,243,232)" stroke="rgb(239,154,74)" stroke-width="2.5"/>
    <text x="108" y="123" font-size="12" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">JL &amp;</text>
    <text x="108" y="138" font-size="12" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">Family</text>
    <rect x="72" y="176" width="72" height="18" rx="9" fill="rgb(253,243,232)" stroke="rgb(239,154,74)" stroke-width="1"/>
    <text x="108" y="188" font-size="9.5" font-weight="700" fill="rgb(180,100,40)" font-family="inherit" text-anchor="middle">Parent</text>
  </g>
  <g>
    <circle cx="80" cy="296" r="36" fill="rgb(255,247,238)" stroke="rgb(245,180,120)" stroke-width="2"/>
    <text x="80" y="292" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">The</text>
    <text x="80" y="305" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">Riveras</text>
    <rect x="46" y="336" width="68" height="16" rx="8" fill="rgb(255,247,238)" stroke="rgb(245,180,120)" stroke-width="1"/>
    <text x="80" y="347" font-size="9" font-weight="700" fill="rgb(180,100,40)" font-family="inherit" text-anchor="middle">Parent</text>
  </g>
  <g>
    <circle cx="406" cy="120" r="44" fill="rgb(231,240,245)" stroke="rgb(97,125,138)" stroke-width="2.5"/>
    <text x="406" y="115" font-size="12" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">Sarah</text>
    <text x="406" y="130" font-size="12" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">M.</text>
    <rect x="366" y="168" width="80" height="18" rx="9" fill="rgb(231,240,245)" stroke="rgb(97,125,138)" stroke-width="1"/>
    <text x="406" y="180" font-size="9.5" font-weight="700" fill="rgb(55,90,106)" font-family="inherit" text-anchor="middle">Caregiver</text>
  </g>
  <g>
    <circle cx="440" cy="280" r="36" fill="rgb(238,246,252)" stroke="rgb(135,168,192)" stroke-width="2"/>
    <text x="440" y="277" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">James</text>
    <text x="440" y="290" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">T.</text>
    <rect x="403" y="320" width="74" height="16" rx="8" fill="rgb(238,246,252)" stroke="rgb(135,168,192)" stroke-width="1"/>
    <text x="440" y="331" font-size="9" font-weight="700" fill="rgb(55,90,106)" font-family="inherit" text-anchor="middle">Caregiver</text>
  </g>
  <g>
    <circle cx="258" cy="336" r="40" fill="rgb(237,248,224)" stroke="rgb(164,201,126)" stroke-width="2.5"/>
    <text x="258" y="330" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">Bright</text>
    <text x="258" y="344" font-size="11" font-weight="700" fill="rgb(75,58,37)" font-family="inherit" text-anchor="middle">Kids Ac.</text>
    <rect x="210" y="380" width="96" height="18" rx="9" fill="rgb(237,248,224)" stroke="rgb(164,201,126)" stroke-width="1"/>
    <text x="258" y="392" font-size="9.5" font-weight="700" fill="rgb(80,140,50)" font-family="inherit" text-anchor="middle">Organisation</text>
  </g>
</svg>`;

export function HeroNetwork() {
  return (
    <div
      className="flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: SVG }}
    />
  );
}
