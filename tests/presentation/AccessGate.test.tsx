import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { IAccessTokenVerifier } from "../../src/application/contracts/IAccessTokenVerifier";
import { AccessGate } from "../../src/presentation/components/AccessGate";

const validHash = "a".repeat(64);

class FakeVerifier implements IAccessTokenVerifier {
  public async verify(token: string): Promise<boolean> {
    return token === "correct-token";
  }
}

describe("AccessGate", () => {
  beforeEach(() => sessionStorage.clear());

  it("does not gate local builds without a configured hash", () => {
    render(
      <AccessGate expectedTokenHash="" verifier={new FakeVerifier()}>
        <p>Protected application</p>
      </AccessGate>,
    );

    expect(screen.getByText("Protected application")).toBeInTheDocument();
  });

  it("rejects an invalid token and unlocks for a matching token", async () => {
    const user = userEvent.setup();
    render(
      <AccessGate expectedTokenHash={validHash} verifier={new FakeVerifier()}>
        <p>Protected application</p>
      </AccessGate>,
    );

    expect(screen.getByRole("heading", { name: "Enter the shared access token." })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Access token"), "wrong-token");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("That access token is not valid.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Access token"), "correct-token");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Protected application")).toBeInTheDocument();
    expect(sessionStorage.length).toBe(1);
  });

  it("shows a configuration error for a malformed deployment hash", () => {
    render(
      <AccessGate expectedTokenHash="invalid" verifier={new FakeVerifier()}>
        <p>Protected application</p>
      </AccessGate>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Access gate is not configured correctly");
    expect(screen.queryByText("Protected application")).not.toBeInTheDocument();
  });
});
