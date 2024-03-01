import { FC } from "react";
import Link from "next/link";
import Text from "./Text";
import NavElement from "./nav-element";
interface Props {
  children: React.ReactNode;
}

export const ContentContainer: React.FC<Props> = ({ children }) => {
  return (
    <div className="drawer h-52 flex-1 flex-col justify-between">
      <input id="my-drawer" type="checkbox" className="drawer-toggle grow" />
      <div className="drawer-content flex flex-col items-center justify-between">
        {children}
      </div>
      {/* SideBar / Drawer */}
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay gap-6"></label>

        <ul className="menu bg-base-100 w-80 items-center gap-10 overflow-y-auto p-4 sm:flex">
          <li>
            <Text
              variant="heading"
              className="mt-10 bg-gradient-to-br from-[#80ff7d] to-[#80ff7d] bg-clip-text text-center  font-extrabold tracking-tighter text-transparent"
            >
              Menu
            </Text>
          </li>
          <li>
            <NavElement label="Home" href="/" />
          </li>
          <li>
            <NavElement label="Basics" href="/basics" />
          </li>
        </ul>
      </div>
    </div>
  );
};
