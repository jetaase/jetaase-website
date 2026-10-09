import styles from "./AdminButton.module.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md"; // sm for row actions, md for Save and Sign in
};

// The one button style for the admin. Defaults to type="button" so it never
// submits a form by accident.
export default function AdminButton({ variant = "default", size = "sm", type = "button", className, ...rest }: Props) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
