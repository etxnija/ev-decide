interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Getting started</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8 text-sm text-gray-700">
          {/* Intro */}
          <p className="text-gray-500">
            EV Decide lets you compare electric vehicles with a customisable scoring system.
            Two optional features unlock extra power — here's how to set them up.
          </p>

          {/* API key */}
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
              Anthropic API key — URL vehicle import
            </h3>
            <p className="text-gray-500">
              Paste a link to any EV listing page and the app will extract the specs automatically using Claude.
            </p>
            <ol className="flex flex-col gap-2 pl-4 list-decimal text-gray-600">
              <li>
                Go to{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">console.anthropic.com</span>
                {" "}and sign in (or create a free account).
              </li>
              <li>Open <strong>API keys</strong> and click <strong>Create key</strong>.</li>
              <li>Copy the key (starts with <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">sk-ant-</span>).</li>
              <li>
                In EV Decide, open <strong>⚙ Settings</strong> and paste it into the{" "}
                <strong>Anthropic API key</strong> field.
              </li>
            </ol>
            <p className="text-xs text-gray-400">
              The key is stored only in your browser and never sent anywhere except Anthropic's API.
            </p>
          </section>

          <hr className="border-gray-100" />

          {/* Gist sync */}
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
              GitHub Gist — sync across devices
            </h3>
            <p className="text-gray-500">
              Your vehicles, notes, scores and settings are kept in a private GitHub Gist so they're available on any device.
            </p>
            <ol className="flex flex-col gap-2 pl-4 list-decimal text-gray-600">
              <li>
                Go to{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">gist.github.com</span>
                {" "}and sign in.
              </li>
              <li>
                Click <strong>+</strong> (New gist), give it any filename (e.g.{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">ev-decide.json</span>),
                add a space as content, and create it as <strong>Secret</strong>.
              </li>
              <li>
                Copy the Gist ID from the URL — it's the long string after your username:{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">gist.github.com/user/<strong>abc123…</strong></span>
              </li>
              <li>
                Go to{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">github.com/settings/tokens</span>,
                click <strong>Generate new token (classic)</strong>, tick the <strong>gist</strong> scope, and create it.
              </li>
              <li>Copy the token (starts with <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">ghp_</span>).</li>
              <li>
                In EV Decide, open <strong>⚙ Settings</strong> and paste both the <strong>Gist ID</strong> and the <strong>GitHub PAT</strong>.
              </li>
            </ol>
            <p className="text-xs text-gray-400">
              The app syncs automatically every 30 seconds and on every change. Use the same Gist ID and token on all your devices.
            </p>
          </section>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
