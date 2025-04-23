import { Modal, Table } from 'react-bootstrap'
import { useCategories } from '../../../hooks/useCategories'
import { useStats } from '@renderer/hooks/useStats'

export const QuizStatsModal = ({ show, onHide }: { show: boolean; onHide: VoidFunction }) => {
  const categories = useCategories()
  const stats = useStats()

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-bar-chart-line me-2"></i>Quiz Statistics
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table size="sm" bordered>
          <tbody>
            <tr>
              <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                <strong>Total Categories</strong>
              </td>
              <td className="text-start">{categories.data?.length}</td>
            </tr>
            <tr>
              <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                <strong>Total Questions</strong>
              </td>
              <td className="text-start">{stats.data?.totalQuestions}</td>
            </tr>
            <tr>
              <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                <strong>Media Questions</strong>
              </td>
              <td className="text-start">{stats.data?.questionsWithMedia}</td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  )
}
