import classNames from "@calcom/ui/classNames";

export function Logo({
  small,
  icon,
  inline = true,
  className,
  // [ceibafy] `src` unused while text logo is active (only referenced in the commented image logo).
  // Prefixed with _ to keep Biome/TS happy; restore to `src` when re-enabling the image logo.
  src: _src = "/api/logo",
}: {
  small?: boolean;
  icon?: boolean;
  inline?: boolean;
  className?: string;
  src?: string;
}) {
  return (
    <h3 className={classNames("logo", inline && "inline", className)}>
      <strong>
        {/* [ceibafy] Original image-based logo (served from /api/logo) — uncomment to restore */}
        {/* {icon ? (
          <img className="mx-auto w-9 dark:invert" alt="Cal.diy" title="Cal.diy" src={`${src}?type=icon`} />
        ) : (
          <img
            className={classNames(small ? "h-4 w-auto" : "h-5 w-auto", "dark:invert")}
            alt="Cal.diy"
            title="Cal.diy"
            src={src}
          />
        )} */}
        {/* [ceibafy] Text-based logo */}
        <span
          title="looknbook"
          style={{
            fontSize: small ? "1.125rem" : "1.5rem",
            fontWeight: 700,
            color: "#9AB17A",
            letterSpacing: "-0.02em",
            fontFamily: "inherit",
          }}>
          {icon ? "L" : "looknbook"}
        </span>
      </strong>
    </h3>
  );
}
