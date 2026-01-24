export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ul className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
          <li>
            <a href="#" className="hover:text-gray-900" data-testid="link-copyright">
              © 2025 MyPaymentVault, Inc.
            </a>
          </li>
          <li>
            <a
              href="#"
              target="_blank"
              className="hover:text-gray-900"
              data-testid="link-terms"
            >
              Terms of Use
            </a>
          </li>
          <li>
            <a
              href="#"
              target="_blank"
              className="hover:text-gray-900"
              data-testid="link-privacy"
            >
              Privacy and Cookies
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-gray-900" data-testid="link-contact">
              Contact Us
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
