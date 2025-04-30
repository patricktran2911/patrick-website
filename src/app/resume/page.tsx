import { Metadata } from "next";
import Resume from "./render";

export const metadata: Metadata = {
  title: "Resume | Patrick Tran",
  description:
    "Interactive resume of Patrick Tran, Software Engineer experienced in iOS, full-stack development, and AI systems.",
};

const Page = () => {
  return <Resume />;
};

export default Page;
