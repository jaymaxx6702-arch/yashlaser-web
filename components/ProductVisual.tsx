import type { CategoryId } from "@/data/catalog";
// Original lightweight placeholder illustrations, replaced by approved photographs later.
export function ProductVisual({
  category,
  className = "",
}: {
  category: CategoryId;
  className?: string;
}) {
  return (
    <div className={`product-visual ${className}`}>
      <svg
        viewBox="0 0 400 340"
        role="img"
        aria-label={`Illustrative ${category.replaceAll("-", " ")} product mockup`}
      >
        <ellipse
          cx="200"
          cy="287"
          rx="115"
          ry="13"
          fill="#413425"
          opacity=".08"
        />
        {category === "standees" && (
          <g>
            <path
              d="M107 261V77Q107 49 135 49H264Q292 49 292 77V261Z"
              fill="#fffcf5"
              stroke="#c6b99e"
              strokeWidth="3"
            />
            <path
              d="M119 251V80Q119 62 138 62H260Q280 62 280 80V251Z"
              fill="#d9d7c2"
            />
            <circle cx="242" cy="102" r="22" fill="#f5edcf" />
            <path
              d="M119 197Q170 115 221 194T280 163V251H119Z"
              fill="#a6ad91"
            />
            <path d="M119 234Q189 166 280 224V251H119Z" fill="#73816f" />
            <path
              d="M153 248Q144 208 174 191Q181 185 189 188Q213 188 218 218L224 251Z"
              fill="#ede3d0"
            />
            <circle cx="185" cy="173" r="20" fill="#b1876b" />
            <path
              d="M165 175Q154 144 184 147Q210 147 204 177L195 161L166 179"
              fill="#493b31"
            />
            <path
              d="M199 250Q192 209 221 191Q250 190 258 251Z"
              fill="#b78868"
            />
            <circle cx="231" cy="177" r="18" fill="#d7af8c" />
            <path
              d="M212 176Q207 149 231 150Q253 150 250 181L240 162L214 177"
              fill="#4d4538"
            />
            <path d="M91 264L287 261L309 276L111 281Z" fill="#c6aa70" />
            <path d="M111 281L309 276V285L111 290Z" fill="#99783e" />
          </g>
        )}
        {category === "awards" && (
          <g>
            <path
              d="M151 78H249L240 145Q232 181 200 184Q168 181 160 145Z"
              fill="#c5a15d"
            />
            <path
              d="M159 80H179L185 156Q189 171 200 177Q175 173 168 146Z"
              fill="#ebd398"
            />
            <path
              d="M151 94H127Q126 151 169 153M249 94H273Q274 151 231 153"
              fill="none"
              stroke="#b28d4a"
              strokeWidth="9"
            />
            <path d="M193 181H207V236H193Z" fill="#b39152" />
            <path d="M174 229H226L237 245H163Z" fill="#c9a86a" />
            <rect
              x="149"
              y="245"
              width="102"
              height="37"
              rx="3"
              fill="#383a35"
            />
            <rect x="169" y="253" width="62" height="19" fill="#c7ad76" />
            <path
              d="M200 100L205 112L219 113L208 122L212 136L200 128L188 136L192 122L181 113L195 112Z"
              fill="#f4e5bc"
            />
          </g>
        )}
        {category === "keychains" && (
          <g transform="rotate(-19 200 180)">
            <circle
              cx="201"
              cy="96"
              r="35"
              fill="none"
              stroke="#a88b54"
              strokeWidth="9"
            />
            <circle
              cx="201"
              cy="96"
              r="34"
              fill="none"
              stroke="#ead8a7"
              strokeWidth="3"
            />
            <path d="M201 129V154" stroke="#a88b54" strokeWidth="8" />
            <rect
              x="149"
              y="151"
              width="105"
              height="123"
              rx="24"
              fill="#b39661"
            />
            <rect
              x="155"
              y="154"
              width="93"
              height="113"
              rx="20"
              fill="#e2cf9f"
            />
            <circle cx="201" cy="165" r="5" fill="#806739" />
            <text
              x="201"
              y="225"
              textAnchor="middle"
              fill="#715a36"
              fontFamily="Georgia, serif"
              fontSize="41"
            >
              A
            </text>
            <path d="M181 239H221" stroke="#a58a55" />
          </g>
        )}
        {category === "id-cards" && (
          <g transform="rotate(8 200 180)">
            <path
              d="M175 39L197 110L222 39"
              fill="none"
              stroke="#4a554b"
              strokeWidth="15"
            />
            <rect
              x="139"
              y="109"
              width="123"
              height="172"
              rx="10"
              fill="#fffdf7"
              stroke="#d0cabd"
            />
            <rect x="179" y="120" width="43" height="7" rx="3" fill="#8e927f" />
            <rect x="154" y="143" width="93" height="6" fill="#b79c62" />
            <circle cx="201" cy="181" r="20" fill="#dadbcb" />
            <circle cx="201" cy="176" r="7" fill="#88917d" />
            <path d="M188 195Q188 178 201 183Q214 180 214 195" fill="#88917d" />
            <path
              d="M173 220H229M184 231H218"
              stroke="#a8aa9b"
              strokeWidth="4"
            />
            <path
              d="M174 254H177M183 254H185M191 254H195M202 254H204M211 254H216M222 254H225"
              stroke="#42493e"
              strokeWidth="10"
            />
          </g>
        )}
        {category === "name-plates" && (
          <g>
            <path d="M55 123L333 103L346 239L68 259Z" fill="#8d7345" />
            <path d="M55 117L333 97L343 231L65 251Z" fill="#dfcd9f" />
            <path
              d="M67 129L322 111L331 220L76 238Z"
              fill="none"
              stroke="#b09660"
            />
            <circle cx="79" cy="141" r="3" fill="#a18958" />
            <circle cx="320" cy="211" r="3" fill="#a18958" />
            <g transform="rotate(-4 200 175)">
              <text
                x="200"
                y="174"
                textAnchor="middle"
                fontSize="25"
                fontFamily="Georgia, serif"
                fill="#514938"
              >
                The Mehtas
              </text>
              <text
                x="200"
                y="199"
                textAnchor="middle"
                fontSize="8"
                letterSpacing="4"
                fill="#746644"
              >
                A PLACE TO BELONG
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
