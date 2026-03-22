import Link from "next/link";

export default function ReviewNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Review Not Found</h1>
      <p className="mt-2 text-gray-500">
        The review you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
