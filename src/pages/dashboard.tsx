import { Can } from "@/components/Can"
import { AuthContext } from "@/contexts/AuthContext"
import { useCan } from "@/hooks/useCan"
import { setupAPIClient } from "@/services/api"
import { api } from "@/services/apiClient"
import { withSSRAuth } from "@/utils/withSSRAuth"
import { useRouter } from "next/navigation"
import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext)
  const router = useRouter();
  const userCanSeeMetrics = useCan({
    roles: ['administrator', 'editor']
  })

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response))
      .catch(err => console.log(err))
  }, [])

  return (
    <>
      <h1>Dashboard {user?.email}</h1>

      <button onClick={() => signOut(router)}>Sign out</button>

      <Can permissions={['metrics.list']}>
        <span>Métricas</span>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get('/me');

  return {
    props: {}
  }
})