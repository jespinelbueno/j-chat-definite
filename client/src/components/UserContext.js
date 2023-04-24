import { createContext } from "react"

const UserContext = createContext({
  username: null,
  id: null,
  avatar_url: null
})

export default UserContext;
