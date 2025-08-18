import './globals.css'; // Your global CSS, including TailwindCSS
import { AuthProvider } from './contexts/AuthContext'; // Import our new AuthProvider

export const metadata = {
  title: 'My Todo App',
  description: 'A Next.js Todo App with Firebase Authentication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap your entire application with AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
