/** template.tsx được mount lại mỗi lần chuyển trang → hiệu ứng chuyển trang mượt (tắt khi giảm chuyển động). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
