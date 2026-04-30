type CommentBodyProps = {
  bodyLines: string[];
};

function renderBodyLine(line: string) {
  const parts = line.split(/(>>\d+)/g);

  return parts.map((part, index) => {
    if (/^>>\d+$/.test(part)) {
      return (
        <span className="font-black text-blue-700" key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function CommentBody({ bodyLines }: CommentBodyProps) {
  return (
    <div className="space-y-1">
      {bodyLines.map((line, index) => (
        <p key={`${line}-${index}`}>{renderBodyLine(line)}</p>
      ))}
    </div>
  );
}
