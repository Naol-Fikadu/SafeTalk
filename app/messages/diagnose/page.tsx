export default function DiagnosePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Messages Diagnostic</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Use the API endpoints to diagnose and fix conversation participant issues:
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">GET /api/messages/diagnose</code>{' '}
          — View conversation diagnostic info
        </li>
        <li>
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">POST /api/messages/diagnose</code>{' '}
          — Fix missing conversation participants
        </li>
      </ul>
    </div>
  );
}