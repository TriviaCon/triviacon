import { useMemo } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { CategoriesProvider } from './context/categories'
import Header from './components/molecules/Header'
import { Container, Row } from 'react-bootstrap'
import ScreenView from './components/organisms/ScreenView/ScreenView'
import ControlView from './components/organisms/ControlView/ControlView'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

function App(): JSX.Element {
  const isScreen = useMemo(
    () => new URLSearchParams(window.location.search).get('screen') === 'true',
    []
  )

  return (
    <Container fluid className="vh-100 vw-100 px-1 py-1 d-flex flex-column">
      <QueryClientProvider client={queryClient}>
        <CategoriesProvider>
          <Row>
            <Header isScreen={isScreen} />
          </Row>
          <Row className="flex-grow-1 d-flex flex-column mx-0">
            {isScreen ? <ScreenView /> : <ControlView />}
          </Row>
        </CategoriesProvider>
        <ReactQueryDevtools initialIsOpen={true} />
      </QueryClientProvider>
    </Container>
  )
}
export default App
