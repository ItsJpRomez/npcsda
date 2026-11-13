/** Shown instead of the Admin Panel until Supabase is connected. */
export function SetupNotice() {
  return (
    <div className="setup">
      <h1>Connect the Admin Panel</h1>
      <p>The Admin Panel needs a Supabase project to store the website&apos;s content and photos.</p>
      <ol>
        <li>Follow the steps in <code>ADMIN-SETUP.md</code> to create the project and run the two SQL files.</li>
        <li>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (and to your Vercel project).</li>
        <li>Restart the site and reload this page.</li>
      </ol>
    </div>
  );
}
