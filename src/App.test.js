import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders hotel management header", () => {
  render(<App />);
  expect(screen.getByText(/GrandLodge Hotel Management/i)).toBeInTheDocument();
});
