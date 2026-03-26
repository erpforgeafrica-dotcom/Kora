declare module "@clerk/clerk-react" {
  export function useAuth(): {
    getToken: () => Promise<string | null>;
  };
}
