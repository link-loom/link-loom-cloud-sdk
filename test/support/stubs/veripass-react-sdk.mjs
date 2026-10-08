// Stands in for `@veripass/react-sdk` in the unit tests: the SDK lists it as a peer dependency and does
// not install it, and the support center only reads the signed-in user from it.
export const useAuth = () => ({ user: null });
