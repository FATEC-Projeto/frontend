import { ENV } from "@/config/env";

export default async function Home() {
  return (
    <main >
      <h1>Frontend OK</h1>
      <p>Ambiente: <strong>{ENV.NEXT_PUBLIC_ENV}</strong></p>
      <p>API base: <strong>{ENV.NEXT_PUBLIC_API_BASE_URL}</strong></p>
    </main>
  );
}
