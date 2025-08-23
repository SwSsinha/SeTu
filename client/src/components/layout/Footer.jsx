export default function Footer() {
  return (
    <footer className="mt-auto text-center text-xs text-muted-foreground py-6" role="contentinfo" aria-label="Site footer">
      <p>© {new Date().getFullYear()} SeTu</p>
    </footer>
  );
}
