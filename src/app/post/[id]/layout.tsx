import { SSEWrapper } from './sse-wrapper';

export default async function PostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SSEWrapper postId={id}>{children}</SSEWrapper>;
}
