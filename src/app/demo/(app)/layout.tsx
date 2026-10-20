import { DemoShell } from "../_components/shell";

export default function DemoAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoShell>{children}</DemoShell>;
}
