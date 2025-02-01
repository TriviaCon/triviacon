import { useMemo } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { CategoriesProvider } from './context/categories'
import Header from './components/molecules/Header'
import { Container, Row } from 'react-bootstrap'
import ScreenView from './components/organisms/ScreenView/ScreenView'
import Footer from './components/molecules/Footer'
import ControlView from './components/organisms/ControlView/ControlView'

function App(): JSX.Element {
  const isScreen = useMemo(
    () => new URLSearchParams(window.location.search).get('screen') === 'true',
    []
  )

  return (
    <Container fluid className="vh-100 vw-100 px-1 py-1 d-flex flex-column overflow-hidden">
      <CategoriesProvider>
        <Row>
          <Header isScreen={isScreen} />
        </Row>
        <Row className="flex-grow-1 d-flex flex-column mx-0">
          {isScreen ? <ScreenView /> : <ControlView />}
        </Row>
        <Row>{isScreen ? null : <Footer />}</Row>
      </CategoriesProvider>
    </Container>
  )
}
export default App
