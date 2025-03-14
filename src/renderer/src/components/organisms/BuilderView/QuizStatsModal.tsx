import { Modal, Table } from 'react-bootstrap'
import { useCategories } from '../../../hooks/useCategories'

export const QuizStatsModal = ({ show, onHide }: { show: boolean; onHide: VoidFunction }) => {
  const { categories } = useCategories()

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
              <td className="text-start">{categories.length}</td>
            </tr>
            <tr>
              <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                <strong>Total Questions</strong>
              </td>
              <td className="text-start">
                {categories.reduce((total, category) => total + category.questions.length, 0)}
              </td>
            </tr>
            <tr>
              <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                <strong>Media Questions</strong>
              </td>
              <td className="text-start">
                {categories.reduce(
                  (total, category) =>
                    total + category.questions.filter((question) => question.media).length,
                  0
                )}
              </td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  )
}
