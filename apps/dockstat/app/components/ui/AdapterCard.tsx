import type { AdapterTable } from "@dockstat/typings";
import { Card, CardBody, CardHeader } from "./Card";

type AdapterCardProps = {
  adapters: AdapterTable[]
}

export default function AdapterCard({ adapters }: AdapterCardProps) {
  const Adapters = {
    docker: adapters.filter((adapter) => adapter.type === "docker")
  } as const

  return (
    <>
      {Adapters.docker.map((adapter) => {
        return (
          <Card key={adapter.id}>
            <CardHeader>
              {adapter.name} - {adapter.type}
            </CardHeader>
            <CardBody>
              <table>
                <tr>
                  <th>
                    Setting
                  </th>
                  <th>
                    Value
                  </th>
                </tr>
                <tr>
                  <td>
                    {adapter.config.defaultTimeout}
                  </td>
                </tr>
              </table>
            </CardBody>
          </Card>
        )
      })}
    </>
  )
}
