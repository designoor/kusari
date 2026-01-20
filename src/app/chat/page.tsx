/**
 * Chat page placeholder
 * This is a temporary page to prevent 404 errors during Phase 2 testing.
 * Full chat implementation will be built in Phase 3.
 */
export default function ChatPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--color-content-primary)',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        Chat (Coming Soon)
      </h1>
      <p style={{ color: 'var(--color-content-secondary)' }}>
        Onboarding complete! Chat interface will be implemented in Phase 3.
      </p>
    </div>
  );
}
